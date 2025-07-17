import { errorHandler } from "@/utils/ErrorHandler.js";

/**
 * 基础图像编辑器适配器接口
 * 定义了所有图像编辑适配器必须实现的标准接口
 */
class BaseImageEditorAdapter {
  constructor() {
    this.isInitialized = false;
    this.container = null;
    this.eventListeners = new Map();
    this.currentImageData = null;
    this.adapterType = "base";
    this.errorContext = {
      adapterType: this.constructor.name,
      version: "1.0.0",
    };
  }

  /**
   * 初始化适配器
   * @param {HTMLElement} container - 容器元素
   * @param {Object} options - 初始化选项
   * @returns {Promise<void>}
   */
  async initialize(container, options = {}) {
    if (this.isInitialized) {
      throw new Error("Adapter is already initialized");
    }

    this.container = container;
    this.options = { ...this.getDefaultOptions(), ...options };

    try {
      await this._doInitialize();
      this.isInitialized = true;
      this.emit("initialized", { adapter: this.adapterType });
    } catch (error) {
      console.error(`Failed to initialize ${this.adapterType} adapter:`, error);
      throw error;
    }
  }

  /**
   * 销毁适配器，释放资源
   */
  destroy() {
    if (!this.isInitialized) return;

    try {
      console.log(
        `BaseImageEditorAdapter: Starting destruction of ${this.adapterType} adapter`
      );

      // 调用子类的销毁方法
      this._doDestroy();

      // 安全清理基类属性
      this._safeCleanup();

      console.log(
        `BaseImageEditorAdapter: ${this.adapterType} adapter destroyed successfully`
      );
    } catch (error) {
      console.error(`Failed to destroy ${this.adapterType} adapter:`, error);

      // 即使出错也要进行基本清理
      this._emergencyCleanup();
    }
  }

  /**
   * 安全清理基类属性
   * @private
   */
  _safeCleanup() {
    try {
      // 清理事件监听器
      if (
        this.eventListeners &&
        typeof this.eventListeners.clear === "function"
      ) {
        this.eventListeners.clear();
      }
      this.eventListeners = null;

      // 清理图像数据
      this.currentImageData = null;

      // 标记为未初始化
      this.isInitialized = false;

      // 清理容器引用
      this.container = null;
    } catch (error) {
      console.warn(`Safe cleanup failed for ${this.adapterType}:`, error);
    }
  }

  /**
   * 紧急清理（当正常清理失败时）
   * @private
   */
  _emergencyCleanup() {
    try {
      console.warn(
        `Performing emergency cleanup for ${this.adapterType} adapter`
      );

      // 强制清理所有属性
      this.eventListeners = null;
      this.currentImageData = null;
      this.isInitialized = false;
      this.container = null;
    } catch (error) {
      console.error(`Emergency cleanup failed for ${this.adapterType}:`, error);
    }
  }

  /**
   * 安全清理Map或Set对象
   * @param {Map|Set} collection - 要清理的集合
   * @param {string} name - 集合名称（用于日志）
   * @protected
   */
  _safeCollectionCleanup(collection, name = "collection") {
    if (!collection) {
      return;
    }

    try {
      if (typeof collection.clear === "function") {
        collection.clear();
        console.log(`${this.adapterType}: ${name} cleared successfully`);
      } else {
        console.warn(`${this.adapterType}: ${name} does not have clear method`);
      }
    } catch (error) {
      console.warn(`${this.adapterType}: Failed to clear ${name}:`, error);
    }
  }

  /**
   * 安全移除DOM元素
   * @param {HTMLElement} element - 要移除的元素
   * @param {string} name - 元素名称（用于日志）
   * @protected
   */
  _safeDOMCleanup(element, name = "element") {
    if (!element) {
      return;
    }

    try {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
        console.log(`${this.adapterType}: ${name} removed from DOM`);
      }
    } catch (error) {
      console.warn(
        `${this.adapterType}: Failed to remove ${name} from DOM:`,
        error
      );
    }
  }

  /**
   * 安全清理数组
   * @param {Array} array - 要清理的数组
   * @param {string} name - 数组名称（用于日志）
   * @protected
   */
  _safeArrayCleanup(array, name = "array") {
    if (!Array.isArray(array)) {
      return;
    }

    try {
      array.length = 0; // 清空数组
      console.log(`${this.adapterType}: ${name} cleared successfully`);
    } catch (error) {
      console.warn(`${this.adapterType}: Failed to clear ${name}:`, error);
    }
  }

  /**
   * 检查适配器是否已初始化
   * @returns {boolean}
   */
  getIsInitialized() {
    return this.isInitialized;
  }

  /**
   * 加载图像
   * @param {string|File|Blob} source - 图像源
   * @returns {Promise<void>}
   */
  async loadImage(source) {
    this._checkInitialized();

    try {
      const imageData = await this._processImageSource(source);
      await this._doLoadImage(imageData);
      this.currentImageData = imageData;
      this.emit("image-loaded", { imageData });
    } catch (error) {
      console.error("Failed to load image:", error);
      this.emit("error", { type: "load-image", error });
      throw error;
    }
  }

  /**
   * 获取当前图像数据
   * @returns {ImageData|null}
   */
  getImageData() {
    return this.currentImageData;
  }

  /**
   * 调整图像大小
   * @param {number} width - 新宽度
   * @param {number} height - 新高度
   * @returns {Promise<void>}
   */
  async resize(width, height) {
    this._checkInitialized();
    await this._doResize(width, height);
    this.emit("resized", { width, height });
  }

  /**
   * 裁剪图像
   * @param {number} x - 裁剪起始X坐标
   * @param {number} y - 裁剪起始Y坐标
   * @param {number} width - 裁剪宽度
   * @param {number} height - 裁剪高度
   * @returns {Promise<void>}
   */
  async crop(x, y, width, height) {
    this._checkInitialized();
    await this._doCrop(x, y, width, height);
    this.emit("cropped", { x, y, width, height });
  }

  /**
   * 旋转图像
   * @param {number} angle - 旋转角度（度）
   * @returns {Promise<void>}
   */
  async rotate(angle) {
    this._checkInitialized();
    await this._doRotate(angle);
    this.emit("rotated", { angle });
  }

  /**
   * 翻转图像
   * @param {boolean} horizontal - 是否水平翻转
   * @param {boolean} vertical - 是否垂直翻转
   * @returns {Promise<void>}
   */
  async flip(horizontal, vertical) {
    this._checkInitialized();
    await this._doFlip(horizontal, vertical);
    this.emit("flipped", { horizontal, vertical });
  }

  /**
   * 设置亮度
   * @param {number} value - 亮度值 (-1 到 1)
   * @returns {Promise<void>}
   */
  async setBrightness(value) {
    this._checkInitialized();
    await this._doSetBrightness(value);
    this.emit("brightness-changed", { value });
  }

  /**
   * 设置对比度
   * @param {number} value - 对比度值 (-1 到 1)
   * @returns {Promise<void>}
   */
  async setContrast(value) {
    this._checkInitialized();
    await this._doSetContrast(value);
    this.emit("contrast-changed", { value });
  }

  /**
   * 应用滤镜
   * @param {string} filterType - 滤镜类型
   * @param {Object} options - 滤镜选项
   * @returns {Promise<void>}
   */
  async applyFilter(filterType, options = {}) {
    this._checkInitialized();
    await this._doApplyFilter(filterType, options);
    this.emit("filter-applied", { filterType, options });
  }

  /**
   * 移除滤镜
   * @param {string} filterType - 滤镜类型
   * @returns {Promise<void>}
   */
  async removeFilter(filterType) {
    this._checkInitialized();
    await this._doRemoveFilter(filterType);
    this.emit("filter-removed", { filterType });
  }

  /**
   * 设置缩放
   * @param {number} scaleX - X轴缩放
   * @param {number} scaleY - Y轴缩放
   * @returns {Promise<void>}
   */
  async setScale(scaleX, scaleY) {
    this._checkInitialized();
    await this._doSetScale(scaleX, scaleY);
    this.emit("scaled", { scaleX, scaleY });
  }

  /**
   * 设置位置
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @returns {Promise<void>}
   */
  async setPosition(x, y) {
    this._checkInitialized();
    await this._doSetPosition(x, y);
    this.emit("positioned", { x, y });
  }

  /**
   * 选择对象
   */
  select() {
    this._checkInitialized();
    this._doSelect();
    this.emit("selected");
  }

  /**
   * 取消选择
   */
  deselect() {
    this._checkInitialized();
    this._doDeselect();
    this.emit("deselected");
  }

  /**
   * 保存当前状态
   * @returns {string} 状态ID
   */
  saveState() {
    this._checkInitialized();
    const stateId = this._generateStateId();
    const state = this._doSaveState();
    this.emit("state-saved", { stateId, state });
    return stateId;
  }

  /**
   * 恢复状态
   * @param {string} stateId - 状态ID
   * @returns {Promise<void>}
   */
  async restoreState(stateId) {
    this._checkInitialized();
    await this._doRestoreState(stateId);
    this.emit("state-restored", { stateId });
  }

  /**
   * 重置到初始状态
   * @returns {Promise<void>}
   */
  async reset() {
    this._checkInitialized();
    await this._doReset();
    this.emit("reset");
  }

  /**
   * 导出为DataURL
   * @param {string} type - 图像类型
   * @param {number} quality - 图像质量
   * @returns {Promise<string>}
   */
  async toDataURL(type = "image/png", quality = 0.9) {
    this._checkInitialized();
    const dataURL = await this._doToDataURL(type, quality);
    this.emit("exported", { type, quality, dataURL });
    return dataURL;
  }

  /**
   * 导出为Blob
   * @param {string} type - 图像类型
   * @param {number} quality - 图像质量
   * @returns {Promise<Blob>}
   */
  async toBlob(type = "image/png", quality = 0.9) {
    this._checkInitialized();
    const blob = await this._doToBlob(type, quality);
    this.emit("exported", { type, quality, blob });
    return blob;
  }

  /**
   * 添加事件监听器
   * @param {string} eventName - 事件名称
   * @param {Function} callback - 回调函数
   */
  on(eventName, callback) {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }
    this.eventListeners.get(eventName).push(callback);
  }

  /**
   * 移除事件监听器
   * @param {string} eventName - 事件名称
   * @param {Function} callback - 回调函数
   */
  off(eventName, callback) {
    if (this.eventListeners.has(eventName)) {
      const listeners = this.eventListeners.get(eventName);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * 触发事件
   * @param {string} eventName - 事件名称
   * @param {Object} data - 事件数据
   */
  emit(eventName, data = {}) {
    if (this.eventListeners.has(eventName)) {
      const listeners = this.eventListeners.get(eventName);
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${eventName}:`, error);
        }
      });
    }
  }

  /**
   * 获取性能指标
   * @returns {Object}
   */
  getPerformanceMetrics() {
    return this._doGetPerformanceMetrics();
  }

  // ========== 受保护的方法，子类需要实现 ==========

  /**
   * 获取默认选项
   * @returns {Object}
   * @protected
   */
  getDefaultOptions() {
    return {};
  }

  /**
   * 执行初始化
   * @returns {Promise<void>}
   * @protected
   */
  async _doInitialize() {
    throw new Error("_doInitialize must be implemented by subclass");
  }

  /**
   * 执行销毁
   * @protected
   */
  _doDestroy() {
    throw new Error("_doDestroy must be implemented by subclass");
  }

  /**
   * 执行图像加载
   * @param {Object} imageData - 图像数据
   * @returns {Promise<void>}
   * @protected
   */
  async _doLoadImage(imageData) {
    throw new Error("_doLoadImage must be implemented by subclass");
  }

  // ========== 私有辅助方法 ==========

  /**
   * 检查是否已初始化
   * @private
   */
  _checkInitialized() {
    if (!this.isInitialized) {
      throw new Error("Adapter is not initialized");
    }
  }

  /**
   * 处理图像源
   * @param {string|File|Blob} source - 图像源
   * @returns {Promise<Object>}
   * @private
   */
  async _processImageSource(source) {
    if (typeof source === "string") {
      return { src: source, type: "url" };
    } else if (source instanceof File) {
      const dataURL = await this._fileToDataURL(source);
      return { src: dataURL, type: "file", file: source };
    } else if (source instanceof Blob) {
      const dataURL = await this._blobToDataURL(source);
      return { src: dataURL, type: "blob", blob: source };
    } else {
      throw new Error("Unsupported image source type");
    }
  }

  /**
   * 将File转换为DataURL
   * @param {File} file - 文件对象
   * @returns {Promise<string>}
   * @private
   */
  _fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * 将Blob转换为DataURL
   * @param {Blob} blob - Blob对象
   * @returns {Promise<string>}
   * @private
   */
  _blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * 生成状态ID
   * @returns {string}
   * @private
   */
  _generateStateId() {
    return `${this.adapterType}_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }

  // ========== 子类需要实现的抽象方法 ==========

  async _doResize(width, height) {
    throw new Error("Not implemented");
  }
  async _doCrop(x, y, width, height) {
    throw new Error("Not implemented");
  }
  async _doRotate(angle) {
    throw new Error("Not implemented");
  }
  async _doFlip(horizontal, vertical) {
    throw new Error("Not implemented");
  }
  async _doSetBrightness(value) {
    throw new Error("Not implemented");
  }
  async _doSetContrast(value) {
    throw new Error("Not implemented");
  }
  async _doApplyFilter(filterType, options) {
    throw new Error("Not implemented");
  }
  async _doRemoveFilter(filterType) {
    throw new Error("Not implemented");
  }
  async _doSetScale(scaleX, scaleY) {
    throw new Error("Not implemented");
  }
  async _doSetPosition(x, y) {
    throw new Error("Not implemented");
  }
  _doSelect() {
    throw new Error("Not implemented");
  }
  _doDeselect() {
    throw new Error("Not implemented");
  }
  _doSaveState() {
    throw new Error("Not implemented");
  }
  async _doRestoreState(stateId) {
    throw new Error("Not implemented");
  }
  async _doReset() {
    throw new Error("Not implemented");
  }
  async _doToDataURL(type, quality) {
    throw new Error("Not implemented");
  }
  async _doToBlob(type, quality) {
    throw new Error("Not implemented");
  }
  _doGetPerformanceMetrics() {
    return {};
  }

  // ========== 错误处理方法 ==========

  /**
   * 处理适配器错误
   * @param {Error|string} error - 错误对象或消息
   * @param {string} operation - 操作名称
   * @param {Object} context - 额外上下文
   * @returns {Object} 错误处理结果
   * @protected
   */
  _handleError(error, operation = "unknown", context = {}) {
    const errorContext = {
      ...this.errorContext,
      operation,
      timestamp: Date.now(),
      ...context,
    };

    return errorHandler.handleError(
      error,
      errorContext,
      errorHandler.errorTypes.ADAPTER,
      this._getErrorLevel(error, operation)
    );
  }

  /**
   * 安全执行操作（带错误处理）
   * @param {Function} operation - 要执行的操作
   * @param {string} operationName - 操作名称
   * @param {Object} context - 上下文信息
   * @returns {Promise<*>} 操作结果
   * @protected
   */
  async _safeExecute(operation, operationName, context = {}) {
    try {
      return await operation();
    } catch (error) {
      const result = this._handleError(error, operationName, context);

      // 如果可以恢复，返回默认值或重试
      if (result.canRecover) {
        return this._getDefaultValue(operationName);
      }

      throw error;
    }
  }

  /**
   * 获取错误级别
   * @param {Error} error - 错误对象
   * @param {string} operation - 操作名称
   * @returns {string} 错误级别
   * @private
   */
  _getErrorLevel(error, operation) {
    // 关键操作的错误级别较高
    const criticalOperations = ["initialize", "loadImage", "destroy"];
    const highOperations = ["applyFilter", "resize", "rotate"];

    if (criticalOperations.includes(operation)) {
      return errorHandler.errorLevels.CRITICAL;
    } else if (highOperations.includes(operation)) {
      return errorHandler.errorLevels.HIGH;
    } else if (
      error.name === "OutOfMemoryError" ||
      error.message.includes("memory")
    ) {
      return errorHandler.errorLevels.CRITICAL;
    } else {
      return errorHandler.errorLevels.MEDIUM;
    }
  }

  /**
   * 获取操作的默认值
   * @param {string} operationName - 操作名称
   * @returns {*} 默认值
   * @private
   */
  _getDefaultValue(operationName) {
    const defaults = {
      getPerformanceMetrics: {},
      getState: null,
      toDataURL: "",
      toBlob: null,
    };

    return defaults[operationName] || null;
  }

  /**
   * 验证参数
   * @param {*} value - 要验证的值
   * @param {string} type - 期望的类型
   * @param {string} paramName - 参数名称
   * @throws {Error} 验证失败时抛出错误
   * @protected
   */
  _validateParam(value, type, paramName) {
    if (value === null || value === undefined) {
      throw new Error(`参数 ${paramName} 不能为空`);
    }

    if (typeof value !== type) {
      throw new Error(
        `参数 ${paramName} 类型错误，期望 ${type}，实际 ${typeof value}`
      );
    }
  }

  /**
   * 验证图像数据
   * @param {Object} imageData - 图像数据
   * @throws {Error} 验证失败时抛出错误
   * @protected
   */
  _validateImageData(imageData) {
    if (!imageData) {
      throw new Error("图像数据不能为空");
    }

    if (!imageData.src && !imageData.data) {
      throw new Error("图像数据必须包含 src 或 data 属性");
    }

    if (imageData.src && typeof imageData.src !== "string") {
      throw new Error("图像 src 必须是字符串");
    }
  }
}

export default BaseImageEditorAdapter;
