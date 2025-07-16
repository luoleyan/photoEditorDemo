import {
  createDefaultImageEditorState,
  validateImageEditorState,
  cloneImageEditorState,
  mergeStateUpdates,
  serializeState,
  deserializeState,
  compareStates,
  getStateDiff
} from './ImageEditorState.js';
import { errorHandler } from '@/utils/ErrorHandler.js';
import { memoryManager } from '@/utils/MemoryManager.js';

/**
 * 状态管理器
 * 负责管理图像编辑器的状态，包括状态创建、更新、历史记录等
 */
class StateManager {
  constructor(options = {}) {
    this.states = new Map();
    this.currentStateId = null;
    this.stateChangeCallbacks = [];
    this.options = {
      maxStates: options.maxStates || 100,
      autoSave: options.autoSave || false,
      autoSaveInterval: options.autoSaveInterval || 30000, // 30秒
      enableCompression: options.enableCompression || false
    };
    
    // 初始化自动保存
    if (this.options.autoSave) {
      this._startAutoSave();
    }
  }

  /**
   * 创建新状态
   * @param {string} libraryType - 库类型
   * @param {Object} imageData - 图像数据
   * @param {string} description - 状态描述
   * @returns {string} 状态ID
   */
  createState(libraryType, imageData = null, description = 'Initial state') {
    const state = createDefaultImageEditorState(libraryType, imageData);
    state.metadata.description = description;
    
    this.states.set(state.id, state);
    this.currentStateId = state.id;
    
    // 限制状态数量
    this._limitStatesCount();
    
    // 触发状态变更回调
    this._notifyStateChange('created', state);
    
    return state.id;
  }

  /**
   * 更新当前状态
   * @param {Object} updates - 更新内容
   * @param {string} actionType - 操作类型
   * @param {string} description - 操作描述
   * @returns {string} 新状态ID
   */
  updateState(updates, actionType = 'update', description = 'State updated') {
    if (!this.currentStateId) {
      throw new Error('No current state to update');
    }
    
    const currentState = this.getState(this.currentStateId);
    if (!currentState) {
      throw new Error(`Current state not found: ${this.currentStateId}`);
    }
    
    // 创建新状态
    const newState = mergeStateUpdates(currentState, updates);
    newState.metadata.lastOperation = {
      type: actionType,
      description: description,
      timestamp: Date.now()
    };
    
    // 验证新状态
    if (!validateImageEditorState(newState)) {
      throw new Error('Invalid state update');
    }
    
    // 保存新状态
    this.states.set(newState.id, newState);
    const previousStateId = this.currentStateId;
    this.currentStateId = newState.id;
    
    // 限制状态数量
    this._limitStatesCount();
    
    // 触发状态变更回调
    this._notifyStateChange('updated', newState, previousStateId);
    
    return newState.id;
  }

  /**
   * 获取状态
   * @param {string} stateId - 状态ID
   * @returns {Object|null} 状态对象
   */
  getState(stateId) {
    return this.states.get(stateId) || null;
  }

  /**
   * 获取当前状态
   * @returns {Object|null} 当前状态对象
   */
  getCurrentState() {
    if (!this.currentStateId) return null;
    return this.getState(this.currentStateId);
  }

  /**
   * 设置当前状态
   * @param {string} stateId - 状态ID
   * @returns {boolean} 是否成功
   */
  setCurrentState(stateId) {
    if (!this.states.has(stateId)) {
      console.warn(`State not found: ${stateId}`);
      return false;
    }
    
    const previousStateId = this.currentStateId;
    this.currentStateId = stateId;
    
    const currentState = this.getState(stateId);
    this._notifyStateChange('switched', currentState, previousStateId);
    
    return true;
  }

  /**
   * 删除状态
   * @param {string} stateId - 状态ID
   * @returns {boolean} 是否成功删除
   */
  deleteState(stateId) {
    if (!this.states.has(stateId)) {
      return false;
    }
    
    // 不能删除当前状态
    if (stateId === this.currentStateId) {
      console.warn('Cannot delete current state');
      return false;
    }
    
    this.states.delete(stateId);
    this._notifyStateChange('deleted', null, stateId);
    
    return true;
  }

  /**
   * 获取所有状态ID
   * @returns {string[]} 状态ID数组
   */
  getAllStateIds() {
    return Array.from(this.states.keys());
  }

  /**
   * 获取状态数量
   * @returns {number} 状态数量
   */
  getStateCount() {
    return this.states.size;
  }

  /**
   * 清空所有状态
   */
  clearAllStates() {
    this.states.clear();
    this.currentStateId = null;
    this._notifyStateChange('cleared');
  }

  /**
   * 序列化状态
   * @param {string} stateId - 状态ID
   * @returns {string} 序列化的状态字符串
   */
  serializeState(stateId) {
    const state = this.getState(stateId);
    if (!state) {
      throw new Error(`State not found: ${stateId}`);
    }
    
    return serializeState(state);
  }

  /**
   * 反序列化状态
   * @param {string} serializedState - 序列化的状态字符串
   * @returns {string} 新状态ID
   */
  deserializeState(serializedState) {
    const state = deserializeState(serializedState);
    
    // 生成新的ID以避免冲突
    const originalId = state.id;
    state.id = this._generateUniqueId();
    state.metadata.deserializedFrom = originalId;
    state.metadata.deserializedAt = Date.now();
    
    this.states.set(state.id, state);
    
    this._notifyStateChange('deserialized', state);
    
    return state.id;
  }

  /**
   * 导出所有状态
   * @returns {string} 导出的JSON字符串
   */
  exportAllStates() {
    const exportData = {
      version: '1.0.0',
      timestamp: Date.now(),
      currentStateId: this.currentStateId,
      states: {}
    };
    
    for (const [id, state] of this.states) {
      exportData.states[id] = state;
    }
    
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * 导入状态
   * @param {string} importData - 导入的JSON字符串
   * @returns {Object} 导入结果
   */
  importStates(importData) {
    try {
      const data = JSON.parse(importData);
      
      if (!data.states || typeof data.states !== 'object') {
        throw new Error('Invalid import data format');
      }
      
      const importedStateIds = [];
      const errors = [];
      
      // 导入状态
      for (const [originalId, state] of Object.entries(data.states)) {
        try {
          if (!validateImageEditorState(state)) {
            errors.push(`Invalid state: ${originalId}`);
            continue;
          }
          
          // 生成新ID
          const newId = this._generateUniqueId();
          state.id = newId;
          state.metadata.importedFrom = originalId;
          state.metadata.importedAt = Date.now();
          
          this.states.set(newId, state);
          importedStateIds.push(newId);
          
        } catch (error) {
          errors.push(`Failed to import state ${originalId}: ${error.message}`);
        }
      }
      
      // 限制状态数量
      this._limitStatesCount();
      
      this._notifyStateChange('imported', null, null, { importedStateIds, errors });
      
      return {
        success: true,
        importedCount: importedStateIds.length,
        importedStateIds,
        errors
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 比较两个状态
   * @param {string} stateId1 - 状态1 ID
   * @param {string} stateId2 - 状态2 ID
   * @returns {Object} 比较结果
   */
  compareStates(stateId1, stateId2) {
    const state1 = this.getState(stateId1);
    const state2 = this.getState(stateId2);
    
    if (!state1 || !state2) {
      throw new Error('One or both states not found');
    }
    
    return {
      areEqual: compareStates(state1, state2),
      differences: getStateDiff(state1, state2)
    };
  }

  /**
   * 注册状态变更回调
   * @param {Function} callback - 回调函数
   */
  onStateChange(callback) {
    if (typeof callback === 'function') {
      this.stateChangeCallbacks.push(callback);
    }
  }

  /**
   * 移除状态变更回调
   * @param {Function} callback - 回调函数
   */
  offStateChange(callback) {
    const index = this.stateChangeCallbacks.indexOf(callback);
    if (index > -1) {
      this.stateChangeCallbacks.splice(index, 1);
    }
  }

  /**
   * 获取状态统计信息
   * @returns {Object} 统计信息
   */
  getStatistics() {
    const states = Array.from(this.states.values());
    
    return {
      totalStates: states.length,
      currentStateId: this.currentStateId,
      libraryTypes: [...new Set(states.map(s => s.libraryType))],
      oldestState: states.reduce((oldest, state) => 
        !oldest || state.timestamp < oldest.timestamp ? state : oldest, null),
      newestState: states.reduce((newest, state) => 
        !newest || state.timestamp > newest.timestamp ? state : newest, null),
      totalOperations: states.reduce((total, state) => 
        total + (state.metadata.operationCount || 0), 0),
      memoryUsage: this._calculateMemoryUsage()
    };
  }

  // ========== 私有方法 ==========

  /**
   * 触发状态变更回调
   * @param {string} action - 操作类型
   * @param {Object} state - 状态对象
   * @param {string} previousStateId - 前一个状态ID
   * @param {Object} extra - 额外数据
   * @private
   */
  _notifyStateChange(action, state = null, previousStateId = null, extra = {}) {
    const eventData = {
      action,
      state,
      previousStateId,
      currentStateId: this.currentStateId,
      timestamp: Date.now(),
      ...extra
    };
    
    this.stateChangeCallbacks.forEach(callback => {
      try {
        callback(eventData);
      } catch (error) {
        console.error('Error in state change callback:', error);
      }
    });
  }

  /**
   * 限制状态数量
   * @private
   */
  _limitStatesCount() {
    if (this.states.size <= this.options.maxStates) {
      return;
    }
    
    // 获取所有状态并按时间戳排序
    const sortedStates = Array.from(this.states.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);
    
    // 删除最旧的状态，但保留当前状态
    const toDelete = sortedStates.slice(0, this.states.size - this.options.maxStates);
    
    for (const [id] of toDelete) {
      if (id !== this.currentStateId) {
        this.states.delete(id);
      }
    }
  }

  /**
   * 生成唯一ID
   * @returns {string}
   * @private
   */
  _generateUniqueId() {
    return `state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 计算内存使用量（估算）
   * @returns {number} 内存使用量（字节）
   * @private
   */
  _calculateMemoryUsage() {
    let totalSize = 0;
    
    for (const state of this.states.values()) {
      try {
        totalSize += JSON.stringify(state).length * 2; // 粗略估算
      } catch (error) {
        // 忽略序列化错误
      }
    }
    
    return totalSize;
  }

  /**
   * 开始自动保存
   * @private
   */
  _startAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
    
    this.autoSaveTimer = setInterval(() => {
      try {
        const currentState = this.getCurrentState();
        if (currentState) {
          const serialized = this.serializeState(currentState.id);
          localStorage.setItem('imageEditor_autoSave', serialized);
          localStorage.setItem('imageEditor_autoSave_timestamp', Date.now().toString());
        }
      } catch (error) {
        console.error('Auto save failed:', error);
      }
    }, this.options.autoSaveInterval);
  }

  /**
   * 停止自动保存
   * @private
   */
  _stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /**
   * 销毁状态管理器
   */
  destroy() {
    this._stopAutoSave();
    this.clearAllStates();
    this.stateChangeCallbacks = [];
  }

  // ========== 跨适配器状态迁移方法 ==========

  /**
   * 迁移状态到新的适配器类型
   * @param {string} stateId - 源状态ID
   * @param {string} targetLibraryType - 目标适配器类型
   * @param {Object} migrationOptions - 迁移选项
   * @returns {Promise<string>} 新状态ID
   */
  async migrateState(stateId, targetLibraryType, migrationOptions = {}) {
    return errorHandler.safeExecute(async () => {
      const sourceState = this.getState(stateId);
      if (!sourceState) {
        throw new Error(`Source state not found: ${stateId}`);
      }

      // 检查是否需要迁移
      if (sourceState.libraryType === targetLibraryType) {
        return stateId; // 无需迁移
      }

      // 创建迁移上下文
      const migrationContext = {
        sourceLibraryType: sourceState.libraryType,
        targetLibraryType,
        options: {
          preserveObjects: migrationOptions.preserveObjects !== false,
          preserveFilters: migrationOptions.preserveFilters !== false,
          preserveAdjustments: migrationOptions.preserveAdjustments !== false,
          preserveTransforms: migrationOptions.preserveTransforms !== false,
          fallbackOnError: migrationOptions.fallbackOnError !== false,
          ...migrationOptions
        }
      };

      // 执行状态迁移
      const migratedState = await this._performStateMigration(sourceState, migrationContext);

      // 保存迁移后的状态
      this.states.set(migratedState.id, migratedState);

      // 记录迁移历史
      this._recordMigration(sourceState.id, migratedState.id, migrationContext);

      return migratedState.id;
    }, 'migrateState', { stateId, targetLibraryType });
  }

  /**
   * 批量迁移状态
   * @param {Array<string>} stateIds - 状态ID数组
   * @param {string} targetLibraryType - 目标适配器类型
   * @param {Object} migrationOptions - 迁移选项
   * @returns {Promise<Array<string>>} 新状态ID数组
   */
  async batchMigrateStates(stateIds, targetLibraryType, migrationOptions = {}) {
    return errorHandler.safeExecute(async () => {
      const results = [];
      const errors = [];

      for (const stateId of stateIds) {
        try {
          const newStateId = await this.migrateState(stateId, targetLibraryType, migrationOptions);
          results.push(newStateId);
        } catch (error) {
          errors.push({ stateId, error });
          if (!migrationOptions.continueOnError) {
            throw error;
          }
        }
      }

      if (errors.length > 0 && !migrationOptions.continueOnError) {
        throw new Error(`Migration failed for ${errors.length} states`);
      }

      return results;
    }, 'batchMigrateStates', { stateIds, targetLibraryType });
  }

  /**
   * 检查状态兼容性
   * @param {string} stateId - 状态ID
   * @param {string} targetLibraryType - 目标适配器类型
   * @returns {Object} 兼容性报告
   */
  checkStateCompatibility(stateId, targetLibraryType) {
    return errorHandler.safeExecute(() => {
      const state = this.getState(stateId);
      if (!state) {
        throw new Error(`State not found: ${stateId}`);
      }

      const compatibility = {
        compatible: true,
        warnings: [],
        unsupportedFeatures: [],
        dataLoss: [],
        recommendations: []
      };

      // 检查基本兼容性
      this._checkBasicCompatibility(state, targetLibraryType, compatibility);

      // 检查对象兼容性
      this._checkObjectCompatibility(state, targetLibraryType, compatibility);

      // 检查滤镜兼容性
      this._checkFilterCompatibility(state, targetLibraryType, compatibility);

      // 检查调整兼容性
      this._checkAdjustmentCompatibility(state, targetLibraryType, compatibility);

      // 生成建议
      this._generateMigrationRecommendations(state, targetLibraryType, compatibility);

      return compatibility;
    }, 'checkStateCompatibility', { stateId, targetLibraryType });
  }

  /**
   * 获取支持的迁移路径
   * @param {string} sourceLibraryType - 源适配器类型
   * @returns {Array<string>} 支持的目标适配器类型
   */
  getSupportedMigrationPaths(sourceLibraryType) {
    const migrationMatrix = {
      'fabric': ['konva', 'tui', 'jimp'],
      'konva': ['fabric', 'tui', 'jimp'],
      'tui': ['fabric', 'konva', 'jimp'],
      'cropper': ['fabric', 'konva', 'jimp'],
      'jimp': ['fabric', 'konva', 'tui']
    };

    return migrationMatrix[sourceLibraryType] || [];
  }

  /**
   * 创建状态快照用于迁移
   * @param {string} stateId - 状态ID
   * @returns {Object} 状态快照
   */
  createMigrationSnapshot(stateId) {
    return errorHandler.safeExecute(() => {
      const state = this.getState(stateId);
      if (!state) {
        throw new Error(`State not found: ${stateId}`);
      }

      // 创建深度克隆的快照
      const snapshot = cloneImageEditorState(state);

      // 添加快照元数据
      snapshot.snapshotMetadata = {
        originalStateId: stateId,
        snapshotTime: Date.now(),
        purpose: 'migration',
        sourceLibraryType: state.libraryType
      };

      return snapshot;
    }, 'createMigrationSnapshot', { stateId });
  }

  // ========== 私有迁移辅助方法 ==========

  /**
   * 执行状态迁移
   * @param {Object} sourceState - 源状态
   * @param {Object} migrationContext - 迁移上下文
   * @returns {Promise<Object>} 迁移后的状态
   * @private
   */
  async _performStateMigration(sourceState, migrationContext) {
    const { targetLibraryType, options } = migrationContext;

    // 创建目标状态
    const targetState = createDefaultImageEditorState(targetLibraryType, sourceState.imageData);

    // 复制基本信息
    targetState.imageData = sourceState.imageData ? { ...sourceState.imageData } : null;
    targetState.canvas = { ...sourceState.canvas };

    // 迁移变换信息
    if (options.preserveTransforms) {
      targetState.transform = this._migrateTransforms(sourceState.transform, migrationContext);
    }

    // 迁移调整参数
    if (options.preserveAdjustments) {
      targetState.adjustments = this._migrateAdjustments(sourceState.adjustments, migrationContext);
    }

    // 迁移滤镜
    if (options.preserveFilters) {
      targetState.filters = this._migrateFilters(sourceState.filters, migrationContext);
    }

    // 迁移对象
    if (options.preserveObjects) {
      targetState.objects = await this._migrateObjects(sourceState.objects, migrationContext);
    }

    // 迁移图层
    targetState.layers = this._migrateLayers(sourceState.layers, migrationContext);

    // 迁移选择状态
    targetState.selection = this._migrateSelection(sourceState.selection, migrationContext);

    // 设置元数据
    targetState.metadata = {
      ...targetState.metadata,
      migratedFrom: sourceState.libraryType,
      migrationTime: Date.now(),
      originalStateId: sourceState.id
    };

    return targetState;
  }

  /**
   * 迁移变换信息
   * @param {Object} transforms - 源变换信息
   * @param {Object} migrationContext - 迁移上下文
   * @returns {Object} 迁移后的变换信息
   * @private
   */
  _migrateTransforms(transforms, migrationContext) {
    const { targetLibraryType } = migrationContext;

    // 基本变换信息通常是通用的
    const migratedTransforms = { ...transforms };

    // 根据目标适配器调整特定格式
    switch (targetLibraryType) {
      case 'fabric':
        // Fabric使用left/top而不是x/y
        if (transforms.position) {
          migratedTransforms.position = {
            left: transforms.position.x || 0,
            top: transforms.position.y || 0
          };
        }
        break;

      case 'konva':
        // Konva使用x/y
        if (transforms.position && transforms.position.left !== undefined) {
          migratedTransforms.position = {
            x: transforms.position.left || 0,
            y: transforms.position.top || 0
          };
        }
        break;

      case 'tui':
        // TUI有特定的变换格式
        migratedTransforms.tuiSpecific = {
          angle: transforms.rotation || 0,
          flipX: transforms.flipX || false,
          flipY: transforms.flipY || false
        };
        break;
    }

    return migratedTransforms;
  }

  /**
   * 迁移调整参数
   * @param {Object} adjustments - 源调整参数
   * @param {Object} migrationContext - 迁移上下文
   * @returns {Object} 迁移后的调整参数
   * @private
   */
  _migrateAdjustments(adjustments, migrationContext) {
    const { targetLibraryType } = migrationContext;
    const migratedAdjustments = { ...adjustments };

    // 根据目标适配器的支持情况调整参数
    const supportMatrix = {
      'fabric': ['brightness', 'contrast', 'saturation'],
      'konva': ['brightness', 'contrast', 'saturation', 'hue'],
      'tui': ['brightness', 'contrast'],
      'jimp': ['brightness', 'contrast', 'saturation', 'hue', 'gamma'],
      'cropper': ['brightness', 'contrast']
    };

    const supportedAdjustments = supportMatrix[targetLibraryType] || [];

    // 过滤不支持的调整
    Object.keys(migratedAdjustments).forEach(key => {
      if (!supportedAdjustments.includes(key)) {
        delete migratedAdjustments[key];
      }
    });

    return migratedAdjustments;
  }

  /**
   * 迁移滤镜
   * @param {Array} filters - 源滤镜数组
   * @param {Object} migrationContext - 迁移上下文
   * @returns {Array} 迁移后的滤镜数组
   * @private
   */
  _migrateFilters(filters, migrationContext) {
    const { targetLibraryType } = migrationContext;

    // 滤镜支持矩阵
    const filterSupportMatrix = {
      'fabric': ['grayscale', 'sepia', 'blur', 'brightness', 'contrast'],
      'konva': ['grayscale', 'blur', 'brightness', 'contrast', 'hue'],
      'tui': ['grayscale', 'sepia', 'blur'],
      'jimp': ['grayscale', 'sepia', 'blur', 'invert', 'posterize'],
      'cropper': ['grayscale', 'sepia', 'blur', 'invert']
    };

    const supportedFilters = filterSupportMatrix[targetLibraryType] || [];

    return filters.filter(filter => {
      if (supportedFilters.includes(filter.type)) {
        return true;
      } else {
        console.warn(`Filter ${filter.type} not supported in ${targetLibraryType}, skipping`);
        return false;
      }
    }).map(filter => this._convertFilterFormat(filter, targetLibraryType));
  }

  /**
   * 转换滤镜格式
   * @param {Object} filter - 源滤镜
   * @param {string} targetLibraryType - 目标适配器类型
   * @returns {Object} 转换后的滤镜
   * @private
   */
  _convertFilterFormat(filter, targetLibraryType) {
    const convertedFilter = { ...filter };

    // 根据目标适配器调整滤镜格式
    switch (targetLibraryType) {
      case 'fabric':
        // Fabric滤镜格式
        if (filter.type === 'blur') {
          convertedFilter.blur = filter.value || filter.radius || 5;
        }
        break;

      case 'konva':
        // Konva滤镜格式
        if (filter.type === 'blur') {
          convertedFilter.blurRadius = filter.value || filter.radius || 5;
        }
        break;

      case 'jimp':
        // Jimp滤镜格式
        if (filter.type === 'blur') {
          convertedFilter.radius = filter.value || filter.radius || 5;
        }
        break;
    }

    return convertedFilter;
  }

  /**
   * 迁移对象
   * @param {Array} objects - 源对象数组
   * @param {Object} migrationContext - 迁移上下文
   * @returns {Promise<Array>} 迁移后的对象数组
   * @private
   */
  async _migrateObjects(objects, migrationContext) {
    const { targetLibraryType } = migrationContext;
    const migratedObjects = [];

    for (const obj of objects) {
      try {
        const migratedObj = await this._migrateObject(obj, targetLibraryType);
        if (migratedObj) {
          migratedObjects.push(migratedObj);
        }
      } catch (error) {
        console.warn(`Failed to migrate object ${obj.id}:`, error);
        if (!migrationContext.options.fallbackOnError) {
          throw error;
        }
      }
    }

    return migratedObjects;
  }

  /**
   * 迁移单个对象
   * @param {Object} obj - 源对象
   * @param {string} targetLibraryType - 目标适配器类型
   * @returns {Promise<Object>} 迁移后的对象
   * @private
   */
  async _migrateObject(obj, targetLibraryType) {
    const migratedObj = {
      ...obj,
      id: obj.id || this._generateObjectId(),
      libraryType: targetLibraryType
    };

    // 根据对象类型和目标适配器调整格式
    switch (obj.type) {
      case 'text':
        return this._migrateTextObject(migratedObj, targetLibraryType);
      case 'shape':
        return this._migrateShapeObject(migratedObj, targetLibraryType);
      case 'image':
        return this._migrateImageObject(migratedObj, targetLibraryType);
      case 'path':
        return this._migratePathObject(migratedObj, targetLibraryType);
      default:
        console.warn(`Unknown object type: ${obj.type}`);
        return migratedObj;
    }
  }

  /**
   * 迁移文本对象
   * @param {Object} textObj - 文本对象
   * @param {string} targetLibraryType - 目标适配器类型
   * @returns {Object} 迁移后的文本对象
   * @private
   */
  _migrateTextObject(textObj, targetLibraryType) {
    const migrated = { ...textObj };

    switch (targetLibraryType) {
      case 'fabric':
        // Fabric文本格式
        migrated.left = textObj.x || textObj.left || 0;
        migrated.top = textObj.y || textObj.top || 0;
        migrated.fill = textObj.color || textObj.fill || '#000000';
        break;

      case 'konva':
        // Konva文本格式
        migrated.x = textObj.left || textObj.x || 0;
        migrated.y = textObj.top || textObj.y || 0;
        migrated.fill = textObj.color || textObj.fill || '#000000';
        break;

      case 'tui':
        // TUI文本格式
        migrated.position = {
          x: textObj.left || textObj.x || 0,
          y: textObj.top || textObj.y || 0
        };
        migrated.styles = {
          fill: textObj.color || textObj.fill || '#000000',
          fontSize: textObj.fontSize || 16,
          fontFamily: textObj.fontFamily || 'Arial'
        };
        break;
    }

    return migrated;
  }

  /**
   * 迁移形状对象
   * @param {Object} shapeObj - 形状对象
   * @param {string} targetLibraryType - 目标适配器类型
   * @returns {Object} 迁移后的形状对象
   * @private
   */
  _migrateShapeObject(shapeObj, targetLibraryType) {
    const migrated = { ...shapeObj };

    // 基本位置转换
    switch (targetLibraryType) {
      case 'fabric':
        migrated.left = shapeObj.x || shapeObj.left || 0;
        migrated.top = shapeObj.y || shapeObj.top || 0;
        break;

      case 'konva':
        migrated.x = shapeObj.left || shapeObj.x || 0;
        migrated.y = shapeObj.top || shapeObj.y || 0;
        break;
    }

    return migrated;
  }

  /**
   * 迁移图像对象
   * @param {Object} imageObj - 图像对象
   * @param {string} targetLibraryType - 目标适配器类型
   * @returns {Object} 迁移后的图像对象
   * @private
   */
  _migrateImageObject(imageObj, targetLibraryType) {
    // 图像对象的迁移相对简单，主要是位置和尺寸
    return this._migrateShapeObject(imageObj, targetLibraryType);
  }

  /**
   * 迁移路径对象
   * @param {Object} pathObj - 路径对象
   * @param {string} targetLibraryType - 目标适配器类型
   * @returns {Object} 迁移后的路径对象
   * @private
   */
  _migratePathObject(pathObj, targetLibraryType) {
    const migrated = { ...pathObj };

    // 路径数据格式转换
    switch (targetLibraryType) {
      case 'fabric':
        // Fabric使用SVG路径格式
        if (pathObj.points) {
          migrated.path = this._convertPointsToSVGPath(pathObj.points);
        }
        break;

      case 'konva':
        // Konva可以使用点数组
        if (pathObj.path) {
          migrated.points = this._convertSVGPathToPoints(pathObj.path);
        }
        break;
    }

    return migrated;
  }

  /**
   * 迁移图层
   * @param {Array} layers - 源图层数组
   * @param {Object} migrationContext - 迁移上下文
   * @returns {Array} 迁移后的图层数组
   * @private
   */
  _migrateLayers(layers, migrationContext) {
    return layers.map(layer => ({
      ...layer,
      libraryType: migrationContext.targetLibraryType
    }));
  }

  /**
   * 迁移选择状态
   * @param {Object} selection - 源选择状态
   * @param {Object} migrationContext - 迁移上下文
   * @returns {Object} 迁移后的选择状态
   * @private
   */
  _migrateSelection(selection, migrationContext) {
    // 选择状态通常是通用的，只需要复制
    return { ...selection };
  }

  /**
   * 生成对象ID
   * @returns {string} 对象ID
   * @private
   */
  _generateObjectId() {
    return `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 将点数组转换为SVG路径
   * @param {Array} points - 点数组
   * @returns {string} SVG路径字符串
   * @private
   */
  _convertPointsToSVGPath(points) {
    if (!points || points.length === 0) return '';

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    return path;
  }

  /**
   * 将SVG路径转换为点数组
   * @param {string} svgPath - SVG路径字符串
   * @returns {Array} 点数组
   * @private
   */
  _convertSVGPathToPoints(svgPath) {
    // 简化的SVG路径解析，只处理M和L命令
    const points = [];
    const commands = svgPath.match(/[ML]\s*[\d\.\-\s,]+/g) || [];

    commands.forEach(command => {
      const coords = command.slice(1).trim().split(/[\s,]+/).map(Number);
      for (let i = 0; i < coords.length; i += 2) {
        if (coords[i] !== undefined && coords[i + 1] !== undefined) {
          points.push({ x: coords[i], y: coords[i + 1] });
        }
      }
    });

    return points;
  }

  // ========== 兼容性检查方法 ==========

  /**
   * 检查基本兼容性
   * @param {Object} state - 状态对象
   * @param {string} targetLibraryType - 目标适配器类型
   * @param {Object} compatibility - 兼容性报告
   * @private
   */
  _checkBasicCompatibility(state, targetLibraryType, compatibility) {
    // 检查图像数据兼容性
    if (state.imageData) {
      const supportedFormats = {
        'fabric': ['jpg', 'jpeg', 'png', 'gif', 'svg'],
        'konva': ['jpg', 'jpeg', 'png', 'gif'],
        'tui': ['jpg', 'jpeg', 'png'],
        'jimp': ['jpg', 'jpeg', 'png', 'bmp', 'tiff'],
        'cropper': ['jpg', 'jpeg', 'png', 'gif']
      };

      const targetFormats = supportedFormats[targetLibraryType] || [];
      const currentFormat = state.imageData.fileType?.toLowerCase();

      if (currentFormat && !targetFormats.includes(currentFormat)) {
        compatibility.warnings.push(`Image format ${currentFormat} may not be fully supported in ${targetLibraryType}`);
      }
    }

    // 检查画布尺寸限制
    const sizeLimits = {
      'fabric': { maxWidth: 16384, maxHeight: 16384 },
      'konva': { maxWidth: 32767, maxHeight: 32767 },
      'tui': { maxWidth: 8192, maxHeight: 8192 },
      'jimp': { maxWidth: 65535, maxHeight: 65535 },
      'cropper': { maxWidth: 16384, maxHeight: 16384 }
    };

    const limits = sizeLimits[targetLibraryType];
    if (limits && state.canvas) {
      if (state.canvas.width > limits.maxWidth || state.canvas.height > limits.maxHeight) {
        compatibility.warnings.push(`Canvas size (${state.canvas.width}x${state.canvas.height}) exceeds ${targetLibraryType} limits`);
      }
    }
  }

  /**
   * 检查对象兼容性
   * @param {Object} state - 状态对象
   * @param {string} targetLibraryType - 目标适配器类型
   * @param {Object} compatibility - 兼容性报告
   * @private
   */
  _checkObjectCompatibility(state, targetLibraryType, compatibility) {
    if (!state.objects || state.objects.length === 0) return;

    const objectSupport = {
      'fabric': ['text', 'shape', 'image', 'path', 'group'],
      'konva': ['text', 'shape', 'image', 'path', 'group'],
      'tui': ['text', 'shape', 'image'],
      'jimp': ['text', 'image'],
      'cropper': ['image']
    };

    const supportedTypes = objectSupport[targetLibraryType] || [];

    state.objects.forEach(obj => {
      if (!supportedTypes.includes(obj.type)) {
        compatibility.unsupportedFeatures.push(`Object type: ${obj.type}`);
        compatibility.dataLoss.push(`Object "${obj.id}" of type "${obj.type}" will be lost`);
      }
    });
  }

  /**
   * 检查滤镜兼容性
   * @param {Object} state - 状态对象
   * @param {string} targetLibraryType - 目标适配器类型
   * @param {Object} compatibility - 兼容性报告
   * @private
   */
  _checkFilterCompatibility(state, targetLibraryType, compatibility) {
    if (!state.filters || state.filters.length === 0) return;

    const filterSupport = {
      'fabric': ['grayscale', 'sepia', 'blur', 'brightness', 'contrast'],
      'konva': ['grayscale', 'blur', 'brightness', 'contrast', 'hue'],
      'tui': ['grayscale', 'sepia', 'blur'],
      'jimp': ['grayscale', 'sepia', 'blur', 'invert', 'posterize'],
      'cropper': ['grayscale', 'sepia', 'blur', 'invert']
    };

    const supportedFilters = filterSupport[targetLibraryType] || [];

    state.filters.forEach(filter => {
      if (!supportedFilters.includes(filter.type)) {
        compatibility.unsupportedFeatures.push(`Filter: ${filter.type}`);
        compatibility.dataLoss.push(`Filter "${filter.type}" will be lost`);
      }
    });
  }

  /**
   * 检查调整兼容性
   * @param {Object} state - 状态对象
   * @param {string} targetLibraryType - 目标适配器类型
   * @param {Object} compatibility - 兼容性报告
   * @private
   */
  _checkAdjustmentCompatibility(state, targetLibraryType, compatibility) {
    if (!state.adjustments) return;

    const adjustmentSupport = {
      'fabric': ['brightness', 'contrast', 'saturation'],
      'konva': ['brightness', 'contrast', 'saturation', 'hue'],
      'tui': ['brightness', 'contrast'],
      'jimp': ['brightness', 'contrast', 'saturation', 'hue', 'gamma'],
      'cropper': ['brightness', 'contrast']
    };

    const supportedAdjustments = adjustmentSupport[targetLibraryType] || [];

    Object.keys(state.adjustments).forEach(adjustment => {
      if (state.adjustments[adjustment] !== 0 && !supportedAdjustments.includes(adjustment)) {
        compatibility.unsupportedFeatures.push(`Adjustment: ${adjustment}`);
        compatibility.dataLoss.push(`Adjustment "${adjustment}" will be reset to default`);
      }
    });
  }

  /**
   * 生成迁移建议
   * @param {Object} state - 状态对象
   * @param {string} targetLibraryType - 目标适配器类型
   * @param {Object} compatibility - 兼容性报告
   * @private
   */
  _generateMigrationRecommendations(state, targetLibraryType, compatibility) {
    // 基于兼容性问题生成建议
    if (compatibility.unsupportedFeatures.length > 0) {
      compatibility.recommendations.push('Consider using a different target adapter that supports more features');
    }

    if (compatibility.dataLoss.length > 0) {
      compatibility.recommendations.push('Create a backup of the current state before migration');
      compatibility.recommendations.push('Review the data loss list and consider manual recreation of lost elements');
    }

    if (compatibility.warnings.length > 0) {
      compatibility.recommendations.push('Test the migrated state thoroughly before proceeding');
    }

    // 特定适配器建议
    switch (targetLibraryType) {
      case 'jimp':
        compatibility.recommendations.push('Jimp is best for server-side image processing');
        break;
      case 'cropper':
        compatibility.recommendations.push('Cropper is specialized for image cropping operations');
        break;
      case 'tui':
        compatibility.recommendations.push('TUI provides a complete UI but has limited programmatic control');
        break;
    }

    // 设置总体兼容性状态
    compatibility.compatible = compatibility.unsupportedFeatures.length === 0 && compatibility.dataLoss.length === 0;
  }

  /**
   * 记录迁移历史
   * @param {string} sourceStateId - 源状态ID
   * @param {string} targetStateId - 目标状态ID
   * @param {Object} migrationContext - 迁移上下文
   * @private
   */
  _recordMigration(sourceStateId, targetStateId, migrationContext) {
    const migrationRecord = {
      sourceStateId,
      targetStateId,
      sourceLibraryType: migrationContext.sourceLibraryType,
      targetLibraryType: migrationContext.targetLibraryType,
      migrationTime: Date.now(),
      options: migrationContext.options
    };

    // 可以将迁移记录保存到数据库或本地存储
    console.log('Migration completed:', migrationRecord);
  }
}

export default StateManager;
