import AdapterFactory from './AdapterFactory.js';

/**
 * 适配器管理器
 * 负责管理多个图像编辑适配器的生命周期和状态转换
 */
class AdapterManager {
  constructor(container, options = {}) {
    this.container = container;
    this.adapters = new Map();
    this.activeAdapter = null;
    this.activeAdapterType = null;
    this.adapterFactory = AdapterFactory;
    this.options = {
      enableCaching: options.enableCaching !== false,
      maxCachedAdapters: options.maxCachedAdapters || 3,
      autoDestroy: options.autoDestroy !== false,
      transferTimeout: options.transferTimeout || 10000 // 10秒
    };
    this.eventListeners = new Map();
  }

  /**
   * 获取适配器
   * @param {string} type - 适配器类型
   * @param {Object} options - 适配器选项
   * @returns {Promise<BaseImageEditorAdapter>}
   */
  async getAdapter(type, options = {}) {
    const adapterType = type.toLowerCase();
    
    // 检查缓存
    if (this.options.enableCaching && this.adapters.has(adapterType)) {
      const adapter = this.adapters.get(adapterType);
      if (adapter.getIsInitialized()) {
        return adapter;
      } else {
        // 适配器已销毁，从缓存中移除
        this.adapters.delete(adapterType);
      }
    }
    
    try {
      // 创建新适配器
      const adapter = await this.adapterFactory.createAdapter(adapterType, this.container, options);
      
      // 设置事件监听
      this._setupAdapterEventListeners(adapter, adapterType);
      
      // 缓存适配器
      if (this.options.enableCaching) {
        this.adapters.set(adapterType, adapter);
        this._limitCachedAdapters();
      }
      
      this.emit('adapter-created', { type: adapterType, adapter });
      
      return adapter;
      
    } catch (error) {
      console.error(`Failed to create ${adapterType} adapter:`, error);
      this.emit('adapter-error', { type: adapterType, error });
      throw error;
    }
  }

  /**
   * 设置活动适配器
   * @param {string} type - 适配器类型
   * @param {Object} options - 适配器选项
   * @returns {Promise<BaseImageEditorAdapter>}
   */
  async setActiveAdapter(type, options = {}) {
    const adapterType = type.toLowerCase();
    
    // 如果已经是活动适配器，直接返回
    if (this.activeAdapterType === adapterType && this.activeAdapter) {
      return this.activeAdapter;
    }
    
    const previousAdapter = this.activeAdapter;
    const previousType = this.activeAdapterType;
    
    try {
      // 获取新适配器
      const newAdapter = await this.getAdapter(adapterType, options);
      
      // 设置为活动适配器
      this.activeAdapter = newAdapter;
      this.activeAdapterType = adapterType;
      
      this.emit('active-adapter-changed', {
        previousType,
        previousAdapter,
        currentType: adapterType,
        currentAdapter: newAdapter
      });
      
      return newAdapter;
      
    } catch (error) {
      console.error(`Failed to set active adapter to ${adapterType}:`, error);
      throw error;
    }
  }

  /**
   * 获取活动适配器
   * @returns {BaseImageEditorAdapter|null}
   */
  getActiveAdapter() {
    return this.activeAdapter;
  }

  /**
   * 获取活动适配器类型
   * @returns {string|null}
   */
  getActiveAdapterType() {
    return this.activeAdapterType;
  }

  /**
   * 检查适配器是否存在
   * @param {string} type - 适配器类型
   * @returns {boolean}
   */
  hasAdapter(type) {
    return this.adapters.has(type.toLowerCase());
  }

  /**
   * 获取所有缓存的适配器类型
   * @returns {string[]}
   */
  getCachedAdapterTypes() {
    return Array.from(this.adapters.keys());
  }

  /**
   * 状态转换
   * @param {string} fromType - 源适配器类型
   * @param {string} toType - 目标适配器类型
   * @param {Object} transferOptions - 转换选项
   * @returns {Promise<void>}
   */
  async transferState(fromType, toType, transferOptions = {}) {
    const sourceAdapter = this.adapters.get(fromType.toLowerCase());
    const targetAdapter = await this.getAdapter(toType.toLowerCase());
    
    if (!sourceAdapter) {
      throw new Error(`Source adapter not found: ${fromType}`);
    }
    
    if (!sourceAdapter.getIsInitialized()) {
      throw new Error(`Source adapter not initialized: ${fromType}`);
    }
    
    try {
      this.emit('state-transfer-start', { fromType, toType });
      
      // 获取源适配器的状态
      const sourceState = await this._extractAdapterState(sourceAdapter);
      
      // 转换状态格式
      const convertedState = await this._convertState(sourceState, fromType, toType);
      
      // 应用到目标适配器
      await this._applyStateToAdapter(targetAdapter, convertedState);
      
      this.emit('state-transfer-complete', { fromType, toType, success: true });
      
    } catch (error) {
      console.error(`State transfer failed from ${fromType} to ${toType}:`, error);
      this.emit('state-transfer-complete', { fromType, toType, success: false, error });
      throw error;
    }
  }

  /**
   * 销毁适配器
   * @param {string} type - 适配器类型
   * @returns {Promise<void>}
   */
  async destroyAdapter(type) {
    const adapterType = type.toLowerCase();
    const adapter = this.adapters.get(adapterType);
    
    if (!adapter) {
      return;
    }
    
    try {
      // 如果是活动适配器，清除引用
      if (this.activeAdapterType === adapterType) {
        this.activeAdapter = null;
        this.activeAdapterType = null;
      }
      
      // 销毁适配器
      adapter.destroy();
      
      // 从缓存中移除
      this.adapters.delete(adapterType);
      
      this.emit('adapter-destroyed', { type: adapterType });
      
    } catch (error) {
      console.error(`Failed to destroy ${adapterType} adapter:`, error);
      this.emit('adapter-error', { type: adapterType, error });
    }
  }

  /**
   * 销毁所有适配器
   * @returns {Promise<void>}
   */
  async destroyAll() {
    const adapterTypes = Array.from(this.adapters.keys());
    
    for (const type of adapterTypes) {
      await this.destroyAdapter(type);
    }
    
    this.activeAdapter = null;
    this.activeAdapterType = null;
    
    this.emit('all-adapters-destroyed');
  }

  /**
   * 获取适配器统计信息
   * @returns {Object}
   */
  getStatistics() {
    const stats = {
      totalAdapters: this.adapters.size,
      activeAdapterType: this.activeAdapterType,
      cachedAdapterTypes: this.getCachedAdapterTypes(),
      adapterDetails: {}
    };
    
    for (const [type, adapter] of this.adapters) {
      stats.adapterDetails[type] = {
        isInitialized: adapter.getIsInitialized(),
        isActive: type === this.activeAdapterType,
        performanceMetrics: adapter.getPerformanceMetrics()
      };
    }
    
    return stats;
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
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${eventName}:`, error);
        }
      });
    }
  }

  // ========== 私有方法 ==========

  /**
   * 设置适配器事件监听
   * @param {BaseImageEditorAdapter} adapter - 适配器实例
   * @param {string} type - 适配器类型
   * @private
   */
  _setupAdapterEventListeners(adapter, type) {
    // 转发适配器事件
    const eventTypes = [
      'image-loaded', 'resized', 'cropped', 'rotated', 'flipped',
      'brightness-changed', 'contrast-changed', 'filter-applied', 'filter-removed',
      'scaled', 'positioned', 'selected', 'deselected', 'state-saved', 'state-restored',
      'reset', 'exported', 'error'
    ];
    
    eventTypes.forEach(eventType => {
      adapter.on(eventType, (data) => {
        this.emit(`adapter-${eventType}`, { adapterType: type, ...data });
      });
    });
  }

  /**
   * 限制缓存的适配器数量
   * @private
   */
  _limitCachedAdapters() {
    if (this.adapters.size <= this.options.maxCachedAdapters) {
      return;
    }
    
    // 获取非活动适配器
    const inactiveAdapters = Array.from(this.adapters.entries())
      .filter(([type]) => type !== this.activeAdapterType);
    
    // 按最后使用时间排序（这里简化为按创建顺序）
    const toDestroy = inactiveAdapters.slice(0, this.adapters.size - this.options.maxCachedAdapters);
    
    toDestroy.forEach(([type]) => {
      this.destroyAdapter(type);
    });
  }

  /**
   * 提取适配器状态
   * @param {BaseImageEditorAdapter} adapter - 适配器实例
   * @returns {Promise<Object>}
   * @private
   */
  async _extractAdapterState(adapter) {
    // 这里需要根据具体适配器实现状态提取逻辑
    // 暂时返回基本信息
    return {
      imageData: adapter.getImageData(),
      performanceMetrics: adapter.getPerformanceMetrics(),
      // 其他状态信息...
    };
  }

  /**
   * 转换状态格式
   * @param {Object} state - 原始状态
   * @param {string} fromType - 源类型
   * @param {string} toType - 目标类型
   * @returns {Promise<Object>}
   * @private
   */
  async _convertState(state, fromType, toType) {
    // 这里需要实现具体的状态转换逻辑
    // 暂时直接返回原状态
    console.log(`Converting state from ${fromType} to ${toType}`);
    return state;
  }

  /**
   * 应用状态到适配器
   * @param {BaseImageEditorAdapter} adapter - 目标适配器
   * @param {Object} state - 转换后的状态
   * @returns {Promise<void>}
   * @private
   */
  async _applyStateToAdapter(adapter, state) {
    // 这里需要根据状态内容应用到适配器
    // 暂时只处理图像数据
    if (state.imageData && state.imageData.src) {
      await adapter.loadImage(state.imageData.src);
    }
  }

  /**
   * 销毁管理器
   */
  async destroy() {
    await this.destroyAll();
    this.eventListeners.clear();
    this.container = null;
  }
}

export default AdapterManager;
